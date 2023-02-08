import pyqrcode

url = pyqrcode.create('https://t.me/liamayathan')
url.svg('./qr_codes/uca-url.svg', scale=8)
url.png('./qr_codes/code.png', scale=6, module_color=[0, 0, 0, 128], background=[0xff, 0xff, 0xcc])
print(url.terminal(quiet_zone=1))