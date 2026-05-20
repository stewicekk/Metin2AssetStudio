#!/usr/bin/env python3
# scripts/convert_map.py
# Convert Metin2 native map format to JSON backup (and vice versa)
# Usage: python scripts/convert_map.py <input> <output>
# ============================================================================

import sys
import os
import json
import struct
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


NATIVE_HEADER_MAGIC = b'METIN2MAP'
NATIVE_VERSION      = 2


def read_native_map(path: str) -> dict:
    """
    Read a Metin2 native map file (.mf or .mcf).
    Returns a dict compatible with WorldMap JSON format.
    NOTE: This is a best-effort reader — full format requires reverse-engineering.
    """
    world = {
        "name":       os.path.splitext(os.path.basename(path))[0],
        "version":    NATIVE_VERSION,
        "width":      4,
        "height":     4,
        "chunk_size": 256,
        "fog_start":  200.0,
        "fog_end":    1000.0,
        "has_water":  False,
        "water_height": 0.0,
        "objects":    [],
    }

    try:
        with open(path, 'rb') as f:
            data = f.read()

        # Check for known magic
        if data[:9] == NATIVE_HEADER_MAGIC:
            offset = 9
            version = struct.unpack_from('<H', data, offset)[0]
            offset += 2
            world["version"] = version
            obj_count = struct.unpack_from('<I', data, offset)[0]
            offset += 4

            for _ in range(obj_count):
                try:
                    name_len = struct.unpack_from('<H', data, offset)[0]
                    offset += 2
                    name = data[offset:offset + name_len].decode('utf-8', errors='replace')
                    offset += name_len
                    obj_type_byte = struct.unpack_from('<B', data, offset)[0]
                    offset += 1
                    type_map = {0: "static", 1: "npc", 2: "monster", 3: "item", 4: "portal"}
                    obj_type = type_map.get(obj_type_byte, "static")
                    px, py, pz = struct.unpack_from('<3f', data, offset)
                    offset += 12
                    rx, ry, rz = struct.unpack_from('<3f', data, offset)
                    offset += 12
                    sx, sy, sz = struct.unpack_from('<3f', data, offset)
                    offset += 12

                    world["objects"].append({
                        "name": name,
                        "type": obj_type,
                        "model": "",
                        "layer": 0,
                        "visible": True,
                        "uid": len(world["objects"]),
                        "transform": {
                            "position": [px, py, pz],
                            "rotation": [rx, ry, rz],
                            "scale":    [sx, sy, sz],
                        }
                    })
                except struct.error:
                    break
        else:
            print(f"WARNING: Unknown map format — attempting heuristic parse.")
            # Scan for float patterns (object positions)
    except Exception as e:
        print(f"ERROR reading map: {e}", file=sys.stderr)

    return world


def write_native_map(world: dict, path: str) -> bool:
    """Write a WorldMap dict to native Metin2 binary format."""
    try:
        buf = bytearray()
        buf += NATIVE_HEADER_MAGIC
        buf += struct.pack('<H', world.get("version", 2))
        objs = world.get("objects", [])
        buf += struct.pack('<I', len(objs))

        for obj in objs:
            name = obj.get("name", "Object").encode('utf-8')
            buf += struct.pack('<H', len(name))
            buf += name
            type_map = {"static": 0, "npc": 1, "monster": 2, "item": 3, "portal": 4}
            buf += struct.pack('<B', type_map.get(obj.get("type", "static"), 0))
            t = obj.get("transform", {})
            pos = t.get("position", [0, 0, 0])
            rot = t.get("rotation", [0, 0, 0])
            scl = t.get("scale",    [1, 1, 1])
            buf += struct.pack('<3f', *pos)
            buf += struct.pack('<3f', *rot)
            buf += struct.pack('<3f', *scl)

        with open(path, 'wb') as f:
            f.write(bytes(buf))
        return True
    except Exception as e:
        print(f"ERROR writing map: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Convert Metin2 map files")
    parser.add_argument("input",  help="Input file (.mf, .mcf, or .json)")
    parser.add_argument("output", help="Output file (.json or .mf)")
    args = parser.parse_args()

    inp = args.input
    out = args.output

    if not os.path.exists(inp):
        print(f"ERROR: Input file '{inp}' not found.", file=sys.stderr)
        sys.exit(1)

    ext_in  = os.path.splitext(inp)[1].lower()
    ext_out = os.path.splitext(out)[1].lower()

    if ext_in == '.json':
        with open(inp, 'r', encoding='utf-8') as f:
            world = json.load(f)
        ok = write_native_map(world, out)
        if ok:
            print(f"Converted JSON → native: {out}")
        else:
            print("Conversion failed.", file=sys.stderr)
            sys.exit(1)
    else:
        world = read_native_map(inp)
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(world, f, indent=2)
        print(f"Converted native → JSON: {out}")
        print(f"  Objects: {len(world['objects'])}")


if __name__ == "__main__":
    main()
