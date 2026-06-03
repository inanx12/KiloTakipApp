/**
 * Rütbe -> vurgu rengi eşlemesi. Mevcut tasarım token'larını kullanır
 * (neon cyan / mor / yeşil / mercan). Havalı görsel pas sonraki iş — şimdilik
 * sade ve tutarlı. Tek yerden kalibre edilir.
 */
import { RankKey } from "./rankConfig";

export const RANK_ACCENT: Record<RankKey, string> = {
  E: "#9A9AB0", // nötr gri — Uyanan
  D: "#00F0FF", // neon cyan — Avcı
  C: "#30E0A1", // yeşil — Kıdemli
  B: "#BF55EC", // mor — Elit
  A: "#FF8A5B", // mercan — Usta
  S: "#FFD23F", // altın — Hükümdar
  MUHAFIZ: "#30E0A1", // sakin yeşil — Bakım Modu
};
