"""测试配置 API"""
import requests

response = requests.get("http://localhost:8000/system/config")
config = response.json()

print("=== 当前配置 API 返回 ===")
for key, value in config.items():
    if isinstance(value, dict):
        print(f"{key}:")
        for k, v in value.items():
            print(f"  {k}: {v}")
    else:
        print(f"{key}: {value}")
