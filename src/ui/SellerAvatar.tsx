import { getSellerInitials } from "@/lib/seller";

type SellerAvatarProps = {
  name: string;
  photo?: string;
  className?: string;
};

export function SellerAvatar({ name, photo, className = "" }: SellerAvatarProps) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`grid place-items-center rounded-full bg-orange-100 font-black text-orange-600 dark:bg-orange-400/10 dark:text-orange-300 ${className}`}>
      {getSellerInitials(name)}
    </div>
  );
}
