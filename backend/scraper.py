import requests
import csv
import time

# Shopify lets us fetch up to 250 products per page via JSON
base_url = "https://circuit.rocks/products.json"
products_list = []
page = 1

print("🚀 Starting SKU extraction from Circuit Rocks...")

while True:
    print(f"📦 Fetching page {page}...")
    response = requests.get(base_url, params={"limit": 250, "page": page}, headers={'User-Agent': 'Mozilla/5.0'})
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch data. Status code: {response.status_code}")
        break
        
    data = response.json()
    products = data.get("products", [])
    
    if not products:
        break  # No more products left, stop looping
        
    for product in products:
        product_name = product.get("title")
        # Products can have multiple variants, grab the SKU for each variant
        for variant in product.get("variants", []):
            sku = variant.get("sku")
            variant_title = variant.get("title")
            
            # If there are multiple choices (like sizes/types), append the variant name
            full_name = product_name
            if variant_title and variant_title != "Default Title":
                full_name = f"{product_name} ({variant_title})"
                
            products_list.append([full_name, sku if sku else "N/A"])
            
    page += 1
    time.sleep(0.5)  # Be polite to their server

# Save everything cleanly to the CSV file
with open('circuit_rocks_skus.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Product Name', 'SKU'])
    writer.writerows(products_list)

print(f"🏁 Done! Extracted {len(products_list)} items into 'circuit_rocks_skus.csv'.")