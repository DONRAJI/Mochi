"""
Capacitor 셸 스플래시 이미지 생성 — `cap add android`가 깔아둔 Capacitor 기본 로고를 모찌로.

배경: 런처 아이콘은 재생성했는데(3b78572) **스플래시는 빠져서** 앱을 열 때마다 파란
Capacitor 로고가 떴다. 스플래시는 mipmap이 아니라 drawable-{port,land}-*/splash.png라
아이콘 재생성 스크립트가 건드리지 않는다.

⚠️ 이건 **네이티브 리소스**라 웹 배포로 반영되지 않는다 — versionCode를 올려 AAB를
다시 빌드·업로드해야 한다. (카드 이미지와 다른 점)

실행: `python scripts/generate-native-splash.py`  (Pillow 필요)
소스: "Mochi Design System/uploads/happy.png" → native/android/app/src/main/res/drawable*/splash.png
"""

import os
from PIL import Image

SRC = os.path.join("Mochi Design System", "uploads", "happy.png")
RES = os.path.join("native", "android", "app", "src", "main", "res")

# capacitor.config.json의 SplashScreen.backgroundColor(#FFF8F0 cream)와 같은 값.
# 배경색이 어긋나면 스플래시가 끝나는 순간 색이 튄다.
BG = (255, 248, 240)

# androidScaleType이 CENTER_CROP이라 가로세로비가 다른 기기에선 가장자리가 잘린다.
# 짧은 변 기준 32%로 두어 어떤 비율에서도 모찌가 안전하게 들어오게 한다.
MOCHI_RATIO = 0.32
ALPHA_TH = 40  # 옅은 그림자는 배경으로 친다(카드 스크립트와 같은 기준)

# cap add android가 만든 11장 — 같은 파일명·같은 크기로 덮어쓴다.
SIZES = {
    "drawable": (480, 320),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
}


def main() -> None:
    if not os.path.exists(SRC):
        raise SystemExit(f"소스 없음: {SRC}")

    mochi = Image.open(SRC).convert("RGBA")
    # 눈에 안 보이는 옅은 그림자까지 그림으로 치면 모찌가 작고 치우쳐 보인다(카드에서 겪은 버그).
    mask = mochi.split()[3].point(lambda v: 255 if v > ALPHA_TH else 0)
    mochi = mochi.crop(mask.getbbox())

    for folder, (w, h) in SIZES.items():
        out_dir = os.path.join(RES, folder)
        if not os.path.isdir(out_dir):
            print(f"  건너뜀(폴더 없음): {folder}")
            continue

        target = round(min(w, h) * MOCHI_RATIO)
        scale = target / max(mochi.width, mochi.height)
        sw, sh = max(1, round(mochi.width * scale)), max(1, round(mochi.height * scale))
        small = mochi.resize((sw, sh), Image.LANCZOS)

        # 스플래시는 알파가 없는 RGB로 저장한다 — 투명이면 기기 기본 배경이 비쳐 색이 튄다.
        canvas = Image.new("RGB", (w, h), BG)
        canvas.paste(small, ((w - sw) // 2, (h - sh) // 2), small)
        canvas.save(os.path.join(out_dir, "splash.png"), "PNG", optimize=True)
        print(f"  {folder} {w}x{h}")

    print("완료: drawable*/splash.png (AAB 재빌드 필요 - 네이티브 리소스)")


if __name__ == "__main__":
    main()
