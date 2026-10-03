
import { cn } from "@/lib/utils";
import { ImagePlus } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import PasteInput from "./paste-input";
import { FieldValues, Path, PathValue, useFormContext } from "react-hook-form";

interface ImageInputProps<T> {
  name: Path<T>;
  label?: string;
  required?: boolean;
  wrapperClassName?: string;
  areaClassName?: string;
}

export default function ImageInput<T extends FieldValues>({
  name,
  label,
  required = false,
  wrapperClassName,
  areaClassName,
}: ImageInputProps<T>) {
  const {
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<T>();

  const currentValue = getValues(name);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue(name, file as PathValue<T, Path<T>>);
      setPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (currentValue && !preview && typeof currentValue === "string") {
      setPreview(currentValue);
    }
  }, [currentValue]);

  return (
    <label
      className={cn(
        "gap-2 grid grid-cols-1 rounded-md overflow-hidden w-auto relative",
        wrapperClassName,
      )}
    >
      {label && <span className="text-sm font-medium">{label}</span>}
      <PasteInput
        onFile={(file) => {
          setValue(name, file as PathValue<T, Path<T>>);
          setPreview(URL.createObjectURL(file));
        }}
      />
      <input
        type="file"
        accept="image/*"
        {...register(name, {
          required: required
            ? { value: true, message: `${label ?? ""}ni kiritish majburiy` }
            : false,
          onChange: handleChange,
        })}
        className="border rounded p-2 w-auto hidden"
      />
      <div
        className={cn(
          "border border-gray-500 rounded-md flex items-end justify-end p-3 w-32 h-32 absolute",
          areaClassName,
        )}
      >
        <div className="p-3 bg-gray-600/50 rounded-full">
          <ImagePlus />
        </div>
      </div>
      <img
        src={
          preview ??
          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
        }
        alt="preview"
        className={cn("object-cover rounded w-32 h-32", areaClassName)}
      />
      {errors[name]?.message && (
        <span className="text-sm text-red-500">
          {String(errors[name]?.message)}
        </span>
      )}
    </label>
  );
}
