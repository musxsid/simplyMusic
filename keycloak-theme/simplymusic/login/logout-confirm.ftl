<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "form">
        <div class="text-center">
            <h2 class="text-2xl font-bold mb-4 text-slate-800 dark:text-white">${msg("logoutConfirmTitle")}</h2>
            <p class="text-slate-600 dark:text-slate-300 mb-8">${msg("logoutConfirmHeader")}</p>
            <form action="${url.logoutConfirmAction}" method="POST">
                <input type="hidden" name="session_code" value="${logoutConfirm.code}">
                <div class="flex flex-col gap-3">
                    <button type="submit" name="confirmLogout" value="yes" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/50 active:scale-95">
                        ${msg("doLogout")}
                    </button>
                </div>
            </form>
        </div>
    </#if>
</@layout.registrationLayout>
