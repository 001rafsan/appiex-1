import re

with open(r'c:\Users\SOWDA\AppData\Local\Temp\index (2).html', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all headings and paragraphs
for m in re.finditer(r'<(h1|h2|h3|p)[^>]*>(.*?)</\1>', text, re.DOTALL):
    tag = m.group(1)
    content = re.sub(r'<[^>]+>', ' ', m.group(2)).strip()
    content = re.sub(r'\s+', ' ', content)
    if content:
        print(f"[{tag.upper()}] {content[:120]}")
