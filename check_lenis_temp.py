with open(r'c:\Users\SOWDA\AppData\Local\Temp\index (2).html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
print("Lenis in index (2).html:", [m.start() for m in re.finditer(r'lenis', text, re.I)])
for m in re.finditer(r'new\s+Lenis', text, re.I):
    print("Found new Lenis at:", m.start())
