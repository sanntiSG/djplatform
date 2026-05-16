import Link from "next/link";

const NavBar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <div className="navbar-item">
                    <Link href="/">Codegrid</Link>
                </div>
            </div>

            <div className="navbar-items">
                <div className="navbar-item">
                    <Link href="/">Home</Link>
                </div>

                <div className="navbar-item">
                    <Link href="/about">About</Link>
                </div>

                <div className="navbar-item">
                    <Link href="/contact">Contact</Link>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
