const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_INPUT_BYTES = 5 * 1024 * 1024

export class ImageInputError extends Error {}

export async function resizeImageToDataUrl(file: File, size = 256): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new ImageInputError('Envie uma imagem PNG, JPG ou WEBP.')
  if (file.size > MAX_INPUT_BYTES) throw new ImageInputError('A imagem deve ter no máximo 5 MB.')
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new ImageInputError('Não foi possível processar a imagem.')
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.85)
}
