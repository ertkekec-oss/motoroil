import os

path = r"c:\Users\Life\Desktop\muhasebe app\motoroil\src\app\customers\[id]\CustomerDetailClient.tsx"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Remove the OTV % line (line 666 in view_file, so index 665)
# Note: Line numbers might have shifted, so search for it.
new_lines = []
found_header = False
for line in lines:
    if "ÖTV %" in line and "th" in line:
        found_header = True
        continue
    new_lines.append(line)

if found_header:
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("Successfully removed header")
else:
    print("Header not found")
