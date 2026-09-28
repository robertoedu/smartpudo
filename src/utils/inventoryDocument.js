export function extractProductCodes(text) {
  return [...new Set(text.match(/(?<!\d)\d{11}(?!\d)/g) || [])];
}

function findEndOfCentralDirectory(view) {
  const minimum = Math.max(0, view.byteLength - 65557);
  for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error("Arquivo Word inválido ou corrompido.");
}

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntry(arrayBuffer, wantedName) {
  const view = new DataView(arrayBuffer);
  const eocd = findEndOfCentralDirectory(view);
  const entries = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();

  for (let index = 0; index < entries; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(new Uint8Array(arrayBuffer, offset + 46, fileNameLength));

    if (name === wantedName) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = new Uint8Array(arrayBuffer, dataOffset, compressedSize);
      if (method === 0) return compressed;
      if (method === 8) return inflateRaw(compressed);
      throw new Error("Compactação do arquivo Word não suportada.");
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error("Não foi possível localizar o texto no arquivo Word.");
}

export async function readInventoryFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "txt") return file.text();
  if (extension !== "docx") throw new Error("Use um arquivo .txt ou .docx.");

  const xmlBytes = await readZipEntry(await file.arrayBuffer(), "word/document.xml");
  const xml = new TextDecoder().decode(xmlBytes);
  const document = new DOMParser().parseFromString(xml, "application/xml");
  return [...document.getElementsByTagNameNS("*", "t")].map((node) => node.textContent).join("\n");
}
