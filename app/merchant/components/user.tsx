interface UserProps {
    contact: string;
    handle: string;
    name: string;
    pending: boolean;
}

export default function User({
    contact,
    handle,
    name,
    pending,
}: UserProps) {

  const userStyle = "rounded-lg p-2 hover:-translate-y-1 hover:shadow-lg transition ease-in-out"

  return (
    <>
      <div className={ !pending ? "bg-green-400 " + userStyle: "bg-blue-100 " + userStyle}>
        <h1 className="font-bold">{name}</h1>
        <a href={`https://t.me/${handle}`} className="font-light hover:text-blue-500">@{handle}</a>
        <h1 className="font-light">{contact}</h1>
      </div>
    </>
  );
}
