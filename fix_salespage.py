import os

file_path = r'c:\Users\omen\Downloads\salepilot\salepilot-frontend\pages\SalesPage.tsx'
log_path = r'c:\Users\omen\Downloads\salepilot\salepilot-frontend\fix.log'

def log(msg):
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(msg + '\n')

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    log(f"Read {len(lines)} lines")

    start_idx = -1
    end_idx = -1
    on_save_idx = -1

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('// ProductFormModal calls onSave(product).'):
            start_idx = i
        if stripped.startswith('setIsProductFormOpen(false); // Temporary placeholder'):
            end_idx = i
        if stripped == 'onSave={() => { }}':
            on_save_idx = i

    log(f"Start: {start_idx}, End: {end_idx}, OnSave: {on_save_idx}")

    if start_idx != -1 and end_idx != -1:
        # Delete reverse to avoid index shifting for OnSave (if it's before)
        # But OnSave is at 1662, Start at 1664.
        # So we can just delete the slice.
        del lines[start_idx : end_idx + 1]
        log("Deleted garbage block")
    else:
        log("Could not find garbage block")

    # Re-find onSave because indices shifted?
    # No, onSave is BEFORE start_idx (1662 < 1664). So it should be stable.
    # BUT verifying.
    
    if on_save_idx != -1:
         # Double check
         if lines[on_save_idx].strip() == 'onSave={() => { }}':
             lines[on_save_idx] = """                onSave={async (newProduct) => {
                    try {
                        const savedProduct = await onSaveProduct(newProduct);
                        addToCart(savedProduct);
                        setIsProductFormOpen(false);
                        setInitialProductValues(undefined);
                        showSnackbar('Product added to catalog and cart!', 'success');
                    } catch (error) {
                        console.error("Failed to save product:", error);
                    }
                }}
"""
             log("Replaced onSave")
         else:
             log("onSave moved or mismatched")
    else:
        log("onSave not found")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    log("Write complete")

except Exception as e:
    log(f"Error: {e}")
