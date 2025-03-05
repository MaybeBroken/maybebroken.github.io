import os
import sys
import string

rootPath = os.path.dirname(os.path.abspath(__file__))
folderPath = os.path.join(rootPath, "api", "v1")
auxFolderPath = None
os.chdir(folderPath)


def pathSafe(path):
    newPath = ""
    for char in path:
        if (
            char
            in string.ascii_letters
            + string.ascii_lowercase
            + string.ascii_uppercase
            + "_-"
            + "."
        ):
            newPath += char
    return newPath


def getAllFiles(path):
    files = []
    for root, dirs, filenames in os.walk(path):
        for filename in filenames:
            print(" " * 190, end="\r")
            print(filename, end="\r")
            if filename not in ["__init__.py", "index.py", "indexGen.py", "index.json"]:
                files.append(os.path.join(root, pathSafe(filename)))
    return files


def generateJsonFile():
    files = getAllFiles(folderPath if auxFolderPath is None else auxFolderPath)
    json = []
    for file in files:
        json.append(file.replace(rootPath, "").replace("\\", "/"))
    with open("index.json", "w", encoding="utf-8") as f:
        f.write(
            str(json)
            .replace("'", '"')
            .replace(",", ",\n   ")
            .replace("[", "[\n   ")
            .replace("]", "\n]")
        )
    print("index.json generated successfully!")


if __name__ == "__main__":
    generateJsonFile()
