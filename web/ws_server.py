import asyncio
import websockets
import socket
import json

PORT = 8080

clients = set()
PING_INTERVAL = 10  # seconds
PING_TIMEOUT = 20   # seconds


def get_local_ip():
    # This method works even if not connected to the internet
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't have to be reachable
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


async def ping_client(websocket):
    while True:
        try:
            await websocket.send(json.dumps({"type": "ping"}))
            await asyncio.sleep(PING_INTERVAL)
        except Exception:
            break


async def handler(websocket, path):
    print(f"[SERVER] Client connecting: {websocket.remote_address}")
    clients.add(websocket)
    print(f"[SERVER] Total clients: {len(clients)}")
    ping_task = asyncio.create_task(ping_client(websocket))
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))
                    continue
                elif data.get("type") == "pong":
                    continue
            except Exception:
                pass
            # Relay to all other clients
            for client in clients:
                if client != websocket:
                    await client.send(message)
    except websockets.ConnectionClosed:
        print(f"[SERVER] Client disconnected: {websocket.remote_address}")
    finally:
        ping_task.cancel()
        clients.remove(websocket)
        print(f"[SERVER] Total clients: {len(clients)}")


async def main():
    local_ip = get_local_ip()
    async with websockets.serve(handler, "0.0.0.0", PORT, ping_interval=None):
        print(f"WebSocket server started on ws://{local_ip}:{PORT}")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
