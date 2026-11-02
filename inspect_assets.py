import re

with open(r'c:\Users\SOWDA\AppData\Local\Temp\index (2).html', 'r', encoding='utf-8') as f:
    text = f.read()

print("CSS Links:")
for m in re.finditer(r'<link[^>]*rel=[\'\"]stylesheet[\'\"][^>]*>', text):
    print(m.group(0))

print("\nScripts:")
for m in re.finditer(r'<script[^>]*src=[\'\"]([^\'\"]*)[\'\"][^>]*>', text):
    print(m.group(1))

print("\nImages/Videos:")
for m in re.finditer(r'<(?:img|video|source)[^>]*src=[\'\"]([^\'\"]*)[\'\"][^>]*>', text):
    print(m.group(1))
