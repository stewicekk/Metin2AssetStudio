# scripts/mse_parser.py
import json
import sys
import re

def parse_mse(text):
    data = {"groups": []}
    
    # Extract Bounding Sphere data
    rad_match = re.search(r"BoundingSphereRadius\s+([\d.]+)", text)
    if rad_match: data["radius"] = float(rad_match.group(1))
    
    pos_match = re.search(r"BoundingSpherePosition\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)", text)
    if pos_match: data["pos"] = [float(pos_match.group(1)), float(pos_match.group(2)), float(pos_match.group(3))]

    # Improved recursive block extraction to handle nested braces properly
    def extract_particle_groups(text):
        groups = []
        # Match "Group Particle" followed by {...}
        pattern = re.compile(r"Group\s+Particle\s*\{", re.IGNORECASE)
        
        pos = 0
        while True:
            match = pattern.search(text, pos)
            if not match: break
            
            start = match.end() - 1 # Index of '{'
            depth = 1
            i = start + 1
            while i < len(text) and depth > 0:
                if text[i] == '{': depth += 1
                elif text[i] == '}': depth -= 1
                i += 1
            
            end = i
            groups.append(text[start:end])
            pos = end
        return groups

    # Parse Particle Groups
    particle_groups = extract_particle_groups(text)
    for pg in particle_groups:
        data["groups"].append(pg)
             
    return data

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python mse_parser.py <input_file>")
        sys.exit(1)
        
    with open(sys.argv[1], 'r', encoding='latin-1') as f: # Metin2 files often use legacy encoding
        content = f.read()
    
    parsed = parse_mse(content)
    print(json.dumps(parsed, indent=4))
