// imgdiff <a.png> <b.png> [cropTopPx]  -> prints "<percent> differing pixels" ; exit 2 if sizes differ.
// Dependency-free on a Mac with Xcode (CoreGraphics). Used by driver.sh verify.
import Foundation
import CoreGraphics
import ImageIO

func load(_ path: String) -> CGImage? {
    guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil) else { return nil }
    return CGImageSourceCreateImageAtIndex(src, 0, nil)
}
func pixels(_ img: CGImage) -> [UInt8] {
    let w = img.width, h = img.height
    var buf = [UInt8](repeating: 0, count: w * h * 4)
    let cs = CGColorSpaceCreateDeviceRGB()
    let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                        space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
    return buf
}
let args = CommandLine.arguments
guard args.count >= 3, let a = load(args[1]), let b = load(args[2]) else { print("usage: imgdiff a.png b.png [cropTop]"); exit(1) }
let cropTop = args.count > 3 ? Int(args[3]) ?? 0 : 0
guard a.width == b.width, a.height == b.height else { print("size mismatch \(a.width)x\(a.height) vs \(b.width)x\(b.height)"); exit(2) }
let pa = pixels(a), pb = pixels(b)
let w = a.width, h = a.height
var diff = 0, total = 0
for y in cropTop..<h {
    for x in 0..<w {
        let i = (y * w + x) * 4
        let d = max(abs(Int(pa[i]) - Int(pb[i])), abs(Int(pa[i+1]) - Int(pb[i+1])), abs(Int(pa[i+2]) - Int(pb[i+2])))
        if d > 32 { diff += 1 }
        total += 1
    }
}
print(String(format: "%.3f", Double(diff) * 100.0 / Double(total)))
