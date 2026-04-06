import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EAST_AFRICAN_COUNTRIES = [
  { name: "Kenya", code: "KE", flag: "🇰🇪" },
];

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CountrySelector = ({ value, onChange, disabled = false }: CountrySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full" disabled={disabled}>
        <SelectValue placeholder="Select country" />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        {EAST_AFRICAN_COUNTRIES.map((country) => (
          <SelectItem key={country.code} value={country.name}>
            <span className="flex items-center gap-2">
              <span className="text-xl">{country.flag}</span>
              <span>{country.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
