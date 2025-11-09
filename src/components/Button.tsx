export const Button = (props: React.PropsWithChildren & { className?: string }) => {
    return (
        <button className={`relative py-3 px-6 rounded-md font-medium text-sm bg-white text-black hover:bg-gray-100 transition-all duration-200 shadow-lg ${props.className || ''}`}>
            <span>{props.children}</span>
        </button>
    );
};