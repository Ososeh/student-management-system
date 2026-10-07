export default function FormField({
  label,
  name,
  error,
  children,
  required = false,
}) {
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && " *"}
      </label>
      {children}
      {error && (
        <p className="field-error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
