import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KENYA_COUNTIES } from "@/lib/kenyaCounties";

interface CountySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CountySelector = ({ value, onChange, disabled = false }: CountySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full rounded-xl h-12 font-bold" disabled={disabled}>
        <SelectValue placeholder="Select county" />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50 max-h-[300px]">
        {KENYA_COUNTIES.map((county) => (
          <SelectItem key={county} value={county}>
            {county}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
