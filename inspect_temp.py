import re

with open(r'c:\Users\SOWDA\AppData\Local\Temp\index (2).html', 'r', encoding='utf-8') as f:
    text = f.read()

print("Total length:", len(text))
for m in re.finditer(r'<section[^>]*>', text):
    print(m.group(0))
