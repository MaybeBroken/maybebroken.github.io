import os
import sys

rootPath = os.path.dirname(os.path.abspath(__file__))
folderPath = os.path.join(rootPath, "api", "v1")
os.chdir(folderPath)


def getAllFiles(path):
    files = []
    for file in os.listdir(path):
        if os.path.isdir(file):
            files += getAllFiles(os.path.join(path, file))
        else:
            if not file in ["__init__.py", "index.py", "indexGen.py", "index.json"]:
                files.append(os.path.join(path, file))
    return files


def generateJsonFile():
    files = getAllFiles(folderPath)
    json = []
    for file in files:
        json.append(file.replace(rootPath, "").replace("\\", "/"))
    with open("index.json", "w", encoding="utf-8") as f:
        f.write(str(json).replace("'", '"'))
    print("index.json generated successfully!")


if __name__ == "__main__":
    generateJsonFile()
