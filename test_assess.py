from backend.auth.jwt import create_access_token
import urllib.request, io, os
from PIL import Image

token = create_access_token({'sub': '4', 'email': 'kishoreg2605@gmail.com', 'role': 'user'})

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = []
def add_field(name, value):
    body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())

def add_file(name, filename, content):
    body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + content + b'\r\n')

add_field('claimed_part', 'Front Bumper')
add_field('claimed_description', 'Damage to front bumper from minor accident')
add_field('claimed_severity', 'Minor')
add_field('vehicle_model', 'Hyundai i20 Asta')
add_field('vehicle_plate', 'KA-01-MJ-8821')

img = Image.new('RGB', (200, 200), color='blue')
buf = io.BytesIO()
img.save(buf, format='JPEG')
add_file('images', 'damage.jpg', buf.getvalue())
body.append(f'--{boundary}--\r\n'.encode())

data = b''.join(body)
req = urllib.request.Request('http://localhost:5000/api/user/assess', data=data, method='POST')
req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
req.add_header('Authorization', f'Bearer {token}')

try:
    with urllib.request.urlopen(req) as res:
        print('SUCCESS: Assess response status:', res.status)
        import json
        out = json.loads(res.read().decode())
        print('Claim ID:', out.get('id'), 'Claim Number:', out.get('claim_number'), 'Verdict:', out.get('verdict'))
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.read().decode())
except Exception as ex:
    print('Error:', ex)
