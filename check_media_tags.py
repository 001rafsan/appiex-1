import re

with open(r'c:\Users\SOWDA\AppData\Local\Temp\index (2).html', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'<(img|video|source)[^>]*>', text):
    print(m.group(0)[:160])
