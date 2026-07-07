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

CANVAS = 512       # 정사각 캔버스
TARGET_BODY = 340  # 모찌 몸통 목표 너비(px) — 이 값이 화면상 모찌 크기를 통일
MARGIN = 12        # 바닥 여백
ALPHA_TH = 40      # 알파 임계(그림자 등 옅은 픽셀 무시)
BOTTOM_BAND = 0.6  # 바닥 40% 영역을 '모찌 몸통'으로 간주


def body_width(im: Image.Image) -> int:
    """바닥 영역에서 불투명 픽셀이 차지하는 가로폭 = 모찌 몸통 너비."""
    w, h = im.size
    px = im.split()[3].load()
    minx, maxx = w, -1
    for y in range(int(h * BOTTOM_BAND), h):
        for x in range(w):
            if px[x, y] > ALPHA_TH:
                if x < minx:
                    minx = x
                if x > maxx:
                    maxx = x
    return max(1, maxx - minx)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for cid, fn in CARDS.items():
        p = os.path.join(SRC, fn)
        if not os.path.exists(p):
            print(f"  건너뜀(파일 없음): {cid} <- {fn}")
            continue
        im = Image.open(p).convert("RGBA")
        im = im.crop(im.getbbox())  # 투명 여백 제거
        scale = TARGET_BODY / body_width(im)
        sw, sh = round(im.width * scale), round(im.height * scale)
        im = im.resize((sw, sh), Image.LANCZOS)
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        canvas.paste(im, ((CANVAS - sw) // 2, CANVAS - MARGIN - sh), im)  # 바닥 정렬(위 넘치면 클립)
        dst = os.path.join(OUT, cid + ".webp")
        canvas.save(dst, "WEBP", quality=82, method=6)
        print(f"  {cid} <- {fn}")
    print("완료 — public/mochi-cards/*.webp")


if __name__ == "__main__":
    main()
