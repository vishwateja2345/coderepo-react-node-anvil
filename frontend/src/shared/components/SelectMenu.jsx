import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MaterialIcon } from "./MaterialIcon.jsx";

export function SelectMenu({ className = "", disabled = false, onChange, options = [], placeholder = "Select", value }) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef(null);
	const listboxId = useId();
	const selectedOption = useMemo(() => options.find((option) => option.value === value) || null, [options, value]);

	useEffect(() => {
		if (!open) {
			return undefined;
		}

		const handleClick = (event) => {
			if (!rootRef.current?.contains(event.target)) {
				setOpen(false);
			}
		};

		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClick);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClick);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	return (
		<div className={`select-menu ${className}`.trim()} ref={rootRef}>
			<button
				aria-controls={listboxId}
				aria-expanded={open}
				aria-haspopup="listbox"
				disabled={disabled}
				onClick={() => setOpen((current) => !current)}
				role="combobox"
				type="button"
			>
				<span>{selectedOption?.label || placeholder}</span>
				<MaterialIcon className="select-menu-arrow" name={open ? "chevron_up" : "chevron_down"} size={18} />
			</button>
			{open ? (
				<div className="select-menu-options" id={listboxId} role="listbox">
					{options.map((option) => (
						<button
							aria-selected={option.value === value}
							key={option.value ?? option.label}
							onClick={() => {
								onChange?.(option.value, option);
								setOpen(false);
							}}
							role="option"
							type="button"
						>
							<span>{option.label}</span>
							{option.description ? <small>{option.description}</small> : null}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
