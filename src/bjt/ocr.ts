import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Jimp, intToRGBA } from 'jimp';
import { InferenceSession, Tensor } from 'onnxruntime-node';

let session: InferenceSession | null = null;
let charset: string[] | null = null;

async function getSession(): Promise<InferenceSession> {
  if (!session) {
    session = await InferenceSession.create(join(process.cwd(), 'models', 'common_old.onnx'), {
      logSeverityLevel: 3,
    });
  }
  return session;
}

function getCharset(): string[] {
  if (!charset) {
    charset = JSON.parse(readFileSync(join(process.cwd(), 'models', 'common_old.json'), 'utf8'));
  }
  return charset as string[];
}

export async function recognizeCaptcha(imageBuffer: Buffer): Promise<string> {
  const inferenceSession = await getSession();
  const captchaCharset = getCharset();
  const image = await Jimp.read(imageBuffer);
  const targetHeight = 64;
  const targetWidth = Math.round(image.width * (targetHeight / image.height));
  image.resize({ w: targetWidth, h: targetHeight });

  const floatData = new Float32Array(targetHeight * targetWidth);
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const pixel = intToRGBA(image.getPixelColor(x, y));
      floatData[y * targetWidth + x] =
        (0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b) / 255.0;
    }
  }

  const inputTensor = new Tensor('float32', floatData, [1, 1, targetHeight, targetWidth]);
  const inputName = inferenceSession.inputNames[0];
  const results = await inferenceSession.run({ [inputName]: inputTensor });
  const output = results[inferenceSession.outputNames[0]];
  const dims = output.dims;
  const data = output.data as Float32Array;

  const seqLen = dims.length === 3 && dims[0] === 1 ? dims[1] : dims[0];
  const numClasses = dims.length === 3 ? dims[2] : dims[1];
  const indices: number[] = [];

  for (let t = 0; t < seqLen; t++) {
    let maxIndex = 0;
    let maxValue = data[t * numClasses];
    for (let c = 1; c < numClasses; c++) {
      const value = data[t * numClasses + c];
      if (value > maxValue) {
        maxValue = value;
        maxIndex = c;
      }
    }
    indices.push(maxIndex);
  }

  const decoded: string[] = [];
  let previous = -1;
  for (const index of indices) {
    if (index !== previous && index !== 0 && index < captchaCharset.length) {
      decoded.push(captchaCharset[index]);
    }
    previous = index;
  }

  return decoded.join('').replace(/[^0-9]/g, '');
}
