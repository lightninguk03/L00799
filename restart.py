import os
import signal
import subprocess
import time

# 查找并停止占用8000端口的进程
result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
for line in result.stdout.split('\n'):
    if ':8000' in line and 'LISTENING' in line:
        pid = line.strip().split()[-1]
        try:
            os.kill(int(pid), signal.SIGTERM)
            print(f"Stopped process {pid}")
            time.sleep(2)
        except:
            pass

# 启动新服务
print("Starting server...")
subprocess.Popen(['uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'])
print("Server started on http://0.0.0.0:8000")
