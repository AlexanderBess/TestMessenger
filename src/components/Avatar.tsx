import { avatarHue, initials } from '../utils/format';

interface AvatarProps {
  id: string;
  title: string;
  size?: number;
}

export function Avatar({ id, title, size = 48 }: AvatarProps) {
  const hue = avatarHue(id);
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 75% 62%), hsl(${(hue + 40) % 360} 70% 52%))`,
      }}
      aria-hidden="true"
    >
      {initials(title)}
    </div>
  );
}
