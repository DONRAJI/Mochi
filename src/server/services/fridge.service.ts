import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { COMMON_INGREDIENTS } from "@/features/fridge/ingredients";
import { estimateExpiry, fridgeCategoryOf, type Storage } from "@/features/fridge/shelfLife";
import type { CreateIngredientRequest, IngredientResponse } from "@/features/fridge/types";

type IngredientRow = {
  id: string;
  name: string;
  category: string;
  rarity: string;
  expiresAt: Date | null;
  storage: string;
};

type Client = Prisma.TransactionClient | typeof db;

const PRESET_BY_NAME = new Map(COMMON_INGREDIENTS.map((p) => [p.name, p]));
const DEFAULT_EMOJI = "🥗";

function toResponse(i: IngredientRow, emoji: string): IngredientResponse {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    rarity: i.rarity,
    expiresAt: i.expiresAt ? i.expiresAt.toISOString() : null,
    emoji,
    storage: i.storage === "freezer" ? "freezer" : "fridge",
  };
}

/**
 * 이름 → 냉장고 분류·이모지. 자주 쓰는 재료 팔레트(손으로 고른 이모지) → 재료 마스터(1,011종, 별칭 포함)
 * 순으로 찾는다. 예전엔 직접 입력은 분류를 손으로 골라야 했고, 장보기에서 옮긴 재료는 늘 '기타'·🥗였다.
 */
async function lookupIngredients(
  client: Client,
  names: string[],
): Promise<Map<string, { category: string; emoji: string }>> {
  const map = new Map<string, { category: string; emoji: string }>();
  const unknown: string[] = [];
  for (const name of new Set(names)) {
    const preset = PRESET_BY_NAME.get(name);
    if (preset) map.set(name, { category: preset.category, emoji: preset.emoji });
    else unknown.push(name);
  }
  if (unknown.length > 0) {
    const masters = await client.ingredientMaster.findMany({
      where: { OR: [{ name: { in: unknown } }, { aliases: { hasSome: unknown } }] },
      select: { name: true, aliases: true, category: true, emoji: true },
    });
    for (const name of unknown) {
      const m =
        masters.find((x) => x.name === name) ?? masters.find((x) => x.aliases.includes(name));
      map.set(name, {
        category: fridgeCategoryOf(m?.category),
        emoji: m?.emoji || DEFAULT_EMOJI,
      });
    }
  }
  return map;
}

export async function listIngredients(
  userId: string,
  page: number,
  size: number,
  category?: string,
): Promise<IngredientResponse[]> {
  const rows = await db.ingredient.findMany({
    where: { userId, ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
    skip: page * size,
    take: size,
  });
  const info = await lookupIngredients(
    db,
    rows.map((r) => r.name),
  );
  return rows.map((r) => toResponse(r, info.get(r.name)?.emoji ?? DEFAULT_EMOJI));
}

/**
 * 재료를 냉장고에 넣는다 — 담기·장보기 이동 공용.
 * - **같은 이름이 이미 있으면 새로 만들지 않는다.** 다시 샀다는 뜻이니 담은 시각·보관 기한만 새로 한다
 *   (예전엔 스티커를 두 번 누르면 두부가 두 개, 장보기에서 옮기면 또 하나 생겼다).
 * - 분류는 입력이 없으면 팔레트·재료 마스터에서, 유통기한은 입력이 없으면 보관 기간으로 추정(shelfLife).
 */
async function stock(
  client: Client,
  userId: string,
  items: { name: string; category?: string; expiresAt?: string; storage?: Storage }[],
): Promise<IngredientResponse[]> {
  const now = new Date();
  const names = items.map((i) => i.name.trim()).filter(Boolean);
  const [info, existing] = await Promise.all([
    lookupIngredients(client, names),
    client.ingredient.findMany({ where: { userId, name: { in: names } } }),
  ]);

  const results: IngredientResponse[] = [];
  const done = new Set<string>();
  for (const item of items) {
    const name = item.name.trim();
    if (!name || done.has(name)) continue;
    done.add(name);

    const found = info.get(name) ?? { category: "기타", emoji: DEFAULT_EMOJI };
    const same = existing.find((e) => e.name === name);
    const category = item.category ?? same?.category ?? found.category;
    // 보관: 이번에 고른 값 → 이미 있던 재료의 보관 → 냉장
    const storage: Storage = item.storage ?? (same?.storage === "freezer" ? "freezer" : "fridge");
    const expiresAt = item.expiresAt
      ? new Date(item.expiresAt)
      : estimateExpiry(name, category, now, storage);

    const row = same
      ? await client.ingredient.update({
          where: { id: same.id },
          data: { expiresAt, storage, createdAt: now },
        })
      : await client.ingredient.create({
          data: { userId, name, category, expiresAt, storage },
        });
    results.push(toResponse(row, found.emoji));
  }
  return results;
}

export async function addIngredient(
  userId: string,
  input: CreateIngredientRequest,
): Promise<IngredientResponse> {
  const [row] = await stock(db, userId, [input]);
  if (!row) throw new AppError("VALIDATION", "재료 이름을 알려줄래요?", 400);
  return row;
}

/** 장보기에서 산 재료들을 냉장고로 — 트랜잭션 안에서 호출된다(shopping.service). */
export function stockIngredients(
  client: Prisma.TransactionClient,
  userId: string,
  names: string[],
): Promise<IngredientResponse[]> {
  return stock(
    client,
    userId,
    names.map((name) => ({ name })),
  );
}

/**
 * 냉장 ↔ 냉동 옮기기 — 소유자 검증 후 보관을 바꾸고, 보관 기한을 **옮긴 시점부터** 다시 추정한다
 * (얼리면 길어지고, 꺼내 해동하면 냉장 기준으로 짧아진다). 직접 적었던 날짜도 이때는 새로 계산한다.
 */
export async function moveIngredient(
  userId: string,
  id: string,
  storage: Storage,
): Promise<IngredientResponse> {
  const found = await db.ingredient.findUnique({ where: { id } });
  if (!found || found.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  const row = await db.ingredient.update({
    where: { id },
    data: {
      storage,
      expiresAt: estimateExpiry(found.name, found.category, new Date(), storage),
    },
  });
  const info = await lookupIngredients(db, [row.name]);
  return toResponse(row, info.get(row.name)?.emoji ?? DEFAULT_EMOJI);
}

export async function removeIngredient(userId: string, id: string): Promise<void> {
  // 소유자 검증 (security.md §4) — 남의 재료는 못 지운다.
  const found = await db.ingredient.findUnique({ where: { id } });
  if (!found || found.userId !== userId) {
    throw new AppError("FORBIDDEN", messages.error.FORBIDDEN, 403);
  }
  await db.ingredient.delete({ where: { id } });
}
