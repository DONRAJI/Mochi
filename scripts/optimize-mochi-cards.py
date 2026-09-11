"""
모찌 뽑기 카드 이미지 최적화 (PRD 12) — 소스마다 프레이밍이 달라도 화면상 모찌 크기를 통일한다.

문제: 원본(투명 PNG)마다 모찌+토핑이 그려진 크기·위치가 제각각이라, 단순 리사이즈하면
      화면에서 모찌 몸통 크기가 카드마다 다르게 보인다(특히 토핑이 위로 긴 카드).
해법: **모찌 몸통(바닥 영역) 너비**를 기준으로 스케일을 맞추고 바닥 정렬 → 몸통 크기 통일,
      토핑은 위로 자연스럽게. 512x512 투명 webp로 저장.

실행: `python scripts/optimize-mochi-cards.py`  (Pillow 필요: pip install Pillow)
소스: "Mochi Design System/uploads"(로컬, gitignore) → 출력: public/mochi-cards/{id}.webp
"""

import os
from PIL import Image

SRC = os.path.join("Mochi Design System", "uploads")
OUT = os.path.join("public", "mochi-cards")

# 카드 id → 원본 파일명 (id는 seed.ts의 MochiCard.id·imageUrl과 일치해야 함)
CARDS = {
    "tofu": "tofu.png", "egg": "egg.png", "milk": "milk.png", "banana": "banana.png",
    "cabbage": "cabbage.png", "apple": "apple.png", "carrot": "carrot.png", "corn": "corn.png",
    "shrimp": "shrmp.png", "cheese": "cheese.png", "broccoli": "broccoli.png", "tomato": "tomato.png",
    "salmon": "salmon.png", "avocado": "avocado.png", "steak": "steak.png", "sweet-potato": "sweet potato.png",
    "bibimbap": "bibimbab.png", "ramen": "ramen.png", "bento": "dosi.png", "dessert": "dessert.png",
}

# 바닥 40%를 '몸통'으로 보는 휴리스틱이 안 맞는 카드의 수동 보정(배율).
# tofu는 두부 블록이 몸통보다 넓게 바닥에 깔려 있어 몸통이 실제보다 크게 측정되고,
# 그만큼 모찌가 작게 렌더된다(측정값 320 vs 나머지 339). 새 카드가 눈에 띄게
# 작거나 크면 여기에 한 줄 추가하는 게 휴리스틱을 건드리는 것보다 안전하다.
SCALE_FIX = {"tofu": 339 / 320}

CANVAS = 512       # 정사각 캔버스
TARGET_BODY = 340  # 모찌 몸통 목표 너비(px) — 이 값이 화면상 모찌 크기를 통일
MARGIN = 12        # 바닥 여백
ALPHA_TH = 40      # 알파 임계(그림자 등 옅은 픽셀 무시)
BOTTOM_BAND = 0.6  # 바닥 40% 영역을 '모찌 몸통'으로 간주


def alpha_mask(im: Image.Image) -> Image.Image:
    """알파 임계로 이진화한 마스크.

    ⚠️ `im.getbbox()`는 **알파 > 0**을 그림으로 친다. 원본에 눈에 거의 안 보이는 옅은
    그림자(알파 1~39)가 붙어 있으면 그것까지 포함해 잘라서, 이후 정렬 기준이 통째로
    어긋난다. 실제로 20장 중 7장이 오른쪽에 최대 179px·아래에 55px의 '유령 여백'을
    갖고 있었고, 그만큼 모찌가 왼쪽·위로 밀려 있었다. 자를 때도 몸통을 잴 때와 같은
    임계(ALPHA_TH)를 쓴다.
    """
    return im.split()[3].point(lambda v: 255 if v > ALPHA_TH else 0)


def body_bounds(mask: Image.Image) -> tuple[int, int]:
    """바닥 영역에서 불투명 픽셀의 좌우 끝(x0, x1) = 모찌 몸통 범위."""
    w, h = mask.size
    band = mask.crop((0, int(h * BOTTOM_BAND), w, h))
    bb = band.getbbox()
    if bb is None:  # 바닥 영역이 비어 있으면 전체 폭으로 폴백
        return 0, w
    return bb[0], bb[2]


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for cid, fn in CARDS.items():
        p = os.path.join(SRC, fn)
        if not os.path.exists(p):
            print(f"  건너뜀(파일 없음): {cid} <- {fn}")
            continue
        im = Image.open(p).convert("RGBA")
        im = im.crop(alpha_mask(im).getbbox())  # 옅은 그림자 제외하고 여백 제거

        bx0, bx1 = body_bounds(alpha_mask(im))
        scale = TARGET_BODY / max(1, bx1 - bx0) * SCALE_FIX.get(cid, 1.0)
        sw, sh = round(im.width * scale), round(im.height * scale)
        im = im.resize((sw, sh), Image.LANCZOS)

        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        # 가로는 전체 폭이 아니라 **몸통 중심**으로 맞춘다 — 전체 bbox 기준으로 가운데를
        # 잡으면 토핑이 한쪽으로 뻗은 카드에서 정작 몸통이 반대편으로 치우친다.
        x = round(CANVAS / 2 - (bx0 + bx1) / 2 * scale)
        canvas.paste(im, (x, CANVAS - MARGIN - sh), im)  # 바닥 정렬(위 넘치면 클립)
        dst = os.path.join(OUT, cid + ".webp")
        canvas.save(dst, "WEBP", quality=82, method=6)
        print(f"  {cid} <- {fn}")
    print("완료: public/mochi-cards/*.webp")  # em-dash는 cp949 콘솔에서 터진다


if __name__ == "__main__":
    main()
