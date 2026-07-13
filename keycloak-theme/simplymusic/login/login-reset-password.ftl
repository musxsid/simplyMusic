<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username'); section>
    <#if section = "header">
        ${msg("emailForgotTitle")}
    <#elseif section = "form">
        <h1 class="text-3xl font-extrabold text-slate-800 dark:text-white text-center mb-4 tracking-tight">${msg("emailForgotTitle")}</h1>
        <p class="text-slate-500 dark:text-slate-400 text-center mb-8 text-sm px-4">
            <#if realm.duplicateEmailsAllowed>
                ${msg("emailInstructionUsername")}
            <#else>
                ${msg("emailInstruction")}
            </#if>
        </p>

        <form id="kc-reset-password-form" class="space-y-5" action="${url.loginAction}" method="post">
            <div>
                <label for="username" class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                </label>
                <input type="text" id="username" name="username" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('username')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all" autofocus value="${(auth.attemptedUsername!'')}" />
                <#if messagesPerField.existsError('username')>
                    <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                </#if>
            </div>
            
            <div class="pt-4">
                <button type="submit" class="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                    ${msg("doSubmit")}
                </button>
            </div>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 text-center">
            <a href="${url.loginUrl}" class="font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
                &laquo; ${msg("backToLogin")}
            </a>
        </div>
    </#if>
</@layout.registrationLayout>
