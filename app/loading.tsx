import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col animate-bounce items-center gap-4">
        <Image src="/imgs/logo.png" alt="Loading" width={50} height={50} />
      </div>
    </div>
  );
}



































