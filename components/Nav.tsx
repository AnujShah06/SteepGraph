import Link from "next/link";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>⬡</span>
          <span className={styles.logoText}>SteepWisdom</span>
        </Link>

        <div className={styles.links}>
          <NavLink href="/" label="Explore" />
          <NavLink href="/graph" label="Graph" />
          <NavLink href="/region" label="Regions" />
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={styles.link}>
      {label}
    </Link>
  );
}
