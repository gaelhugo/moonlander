import xml.etree.ElementTree as ET

# Load the SVG file
svg_file = "AJ1_LUNAR_LANDER_TARCING.svg"
tree = ET.parse(svg_file)
root = tree.getroot()

# Find the polyline element and extract the points
points = root.find(".//{http://www.w3.org/2000/svg}polyline").get("points")

# Split the points into individual coordinate pairs
point_pairs = points.split()

# Extract and print the x, y coordinates
for pair in point_pairs:
    x, y = map(float, pair.split(","))
    # print(f"x: {x}, y: {y}")
    print(f"points.push(new Vector2({x}, {y}));")

print(len(point_pairs))
