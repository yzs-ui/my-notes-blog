from PIL import Image, ImageDraw, ImageFont

# 创建一个 64x64 的图像
img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# 绘制渐变背景（简化为纯色）
draw.ellipse([2, 2, 62, 62], fill=(74, 158, 255, 255))

# 添加文字
try:
    font = ImageFont.truetype('arial.ttf', 40)
except:
    font = ImageFont.load_default()

draw.text((32, 32), '鱼', fill=(0, 0, 0), font=font, anchor='mm')

# 保存为 ICO 文件
img.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

print('favicon.ico 创建成功')
