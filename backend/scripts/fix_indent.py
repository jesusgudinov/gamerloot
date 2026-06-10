import os

file_path = "/Users/rampage/Documents/Gamer Loot Desarrollo/backend/app/routers/sync.py"
with open(file_path, "r") as f:
    lines = f.readlines()

out = []
in_quantum = False
in_techsmart = False

for line in lines:
    if line.startswith("async def run_quantum_sync"):
        in_quantum = True
        out.append(line)
        continue
    if line.startswith("async def run_techsmart_sync"):
        in_techsmart = True
        out.append(line)
        continue
        
    if in_quantum:
        if line.strip() == "except Exception as e:":
            in_quantum = False
            out.append("    except Exception as e:\n")
            continue
        # If it's after try, indent 4 spaces
        # Wait, the try: is already at 4 spaces. Everything inside should be 8.
        # Let's find out if it's currently at 4 spaces and not `try:`
        if line.startswith("    ") and not line.startswith("        ") and line.strip() != "try:" and line.strip() != "except Exception as e:":
            out.append("    " + line)
        else:
            out.append(line)
    elif in_techsmart:
        if line.strip() == "except Exception as e:":
            in_techsmart = False
            out.append("    except Exception as e:\n")
            continue
        if line.startswith("    ") and not line.startswith("        ") and line.strip() != "try:" and line.strip() != "except Exception as e:" and line.strip() != "def update_techsmart_progress(progress_pct, msg):":
            # Wait, functions inside might have different indents. Let's just indent anything that starts exactly with 4 spaces to 8 spaces.
            out.append("    " + line)
        else:
            out.append(line)
    else:
        out.append(line)

with open(file_path, "w") as f:
    f.writelines(out)
