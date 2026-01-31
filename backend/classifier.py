import torch
import torchvision.transforms as transforms
from PIL import Image

class DemographicClassifier:
    def __init__(self, model):
        self.model = model
        self.transform = transforms.Compose([
            transforms.Resize((224,224)),
            transforms.ToTensor()
        ])

    def classify(self, frame, bbox):
        x1,y1,x2,y2 = bbox
        crop = frame[y1:y2, x1:x2]

        img = Image.fromarray(crop)
        img = self.transform(img).unsqueeze(0)

        with torch.no_grad():
            output = self.model(img)

        cls = output.argmax().item()

        if cls == 0:
            return "male"
        elif cls == 1:
            return "female"
        else:
            return "child"
