from PIL import Image, ImageDraw
import os

def create_task_icon():
    # Create a 256x256 image with transparent background
    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background circle
    center = size // 2
    radius = 100
    
    # Create circular background
    draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                 fill=(79, 70, 229, 255))  # Blue background
    
    # Draw clipboard shape
    clipboard_x = center - 40
    clipboard_y = center - 50
    clipboard_w = 80
    clipboard_h = 100
    
    # Clipboard background
    draw.rectangle([clipboard_x, clipboard_y, clipboard_x+clipboard_w, clipboard_y+clipboard_h],
                   fill=(255, 255, 255, 240), outline=(200, 200, 200, 255))
    
    # Clipboard clip
    clip_x = center - 15
    clip_y = clipboard_y - 8
    draw.rectangle([clip_x, clip_y, clip_x+30, clip_y+16],
                   fill=(100, 116, 139, 255))
    draw.rectangle([clip_x+4, clip_y+4, clip_x+26, clip_y+12],
                   fill=(255, 255, 255, 255))
    
    # Draw checkboxes and lines (tasks)
    task_y_start = clipboard_y + 20
    task_spacing = 20
    
    for i in range(4):
        y = task_y_start + i * task_spacing
        checkbox_x = clipboard_x + 10
        line_x = checkbox_x + 20
        
        if i < 2:  # Completed tasks
            # Green checkbox
            draw.rectangle([checkbox_x, y, checkbox_x+12, y+12],
                          fill=(16, 185, 129, 255))
            # Checkmark
            draw.line([checkbox_x+3, y+6, checkbox_x+6, y+9], fill=(255, 255, 255, 255), width=2)
            draw.line([checkbox_x+6, y+9, checkbox_x+10, y+4], fill=(255, 255, 255, 255), width=2)
            # Task line (completed - gray)
            draw.rectangle([line_x, y+4, line_x+35, y+8],
                          fill=(156, 163, 175, 255))
        else:  # Pending tasks
            # Empty checkbox
            draw.rectangle([checkbox_x, y, checkbox_x+12, y+12],
                          fill=(255, 255, 255, 255), outline=(156, 163, 175, 255))
            # Task line (pending - dark)
            draw.rectangle([line_x, y+4, line_x+30, y+8],
                          fill=(75, 85, 99, 255))
    
    # Add a subtle glow effect
    glow_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_draw.ellipse([center-radius-5, center-radius-5, center+radius+5, center+radius+5],
                      fill=(255, 255, 255, 30))
    
    # Composite the glow
    img = Image.alpha_composite(glow_img, img)
    
    return img

# Check if PIL is available
try:
    icon = create_task_icon()
    icon.save('appicon.png')
    print("✅ Icono PNG creado exitosamente: build/appicon.png")
except ImportError:
    print("❌ PIL/Pillow no está instalado. Instalando...")
    os.system("pip install Pillow")
    try:
        icon = create_task_icon()
        icon.save('appicon.png')
        print("✅ Icono PNG creado exitosamente: build/appicon.png")
    except Exception as e:
        print(f"❌ Error creando el icono: {e}")
        print("Por favor, convierte manualmente el archivo SVG a PNG usando un convertidor online.")