import Image from "next/image";
import Link from "next/link";
import { input_field_class, label_class, primary_button_class } from "@/components/auth/form_styles";

export function Forgot_password_form() {
    return (
        <div className="w-full max-w-[440px]">
            <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">
                Account recovery
            </p>
            <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">
                Reset your password
            </h1>
            <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                Password resets are reviewed by IT Staff. Enter the email and employee ID on your account.
            </p>

            <form className="mt-[26px] flex flex-col gap-4">
                <div>
                    <label htmlFor="email" className={`block ${label_class}`}>
                        Email address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="name@cdrrmo.gov.ph"
                        className={`mt-1.5 ${input_field_class}`}
                    />
                </div>

                <div>
                    <label htmlFor="employee_id" className={`block ${label_class}`}>
                        Employee ID
                    </label>
                    <input
                        id="employee_id"
                        name="employee_id"
                        type="text"
                        autoComplete="off"
                        required
                        placeholder="CDRRMO-0000"
                        className={`mt-1.5 ${input_field_class}`}
                    />
                </div>

                <button type="submit" className={`mt-2 w-full py-3.5 text-xs leading-[18px] ${primary_button_class}`}>
                    Request reset
                    <Image src="/login/icon_arrow_right.svg" alt="" width={18} height={18} />
                </button>
            </form>

            <p className="mt-[94px] text-center text-[11px] leading-[16.5px] text-agap-muted">
                Remembered it?{" "}
                <Link href="/login" className="font-semibold text-agap-700 underline">
                    Back to sign in
                </Link>
            </p>
        </div>
    );
}
