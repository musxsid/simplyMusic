<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <h1 class="text-3xl font-extrabold text-slate-800 dark:text-white text-center mb-8 tracking-tight">${msg("loginAccountTitle")}</h1>
        
        <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" class="space-y-5">
            <div>
                <label for="username" class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                </label>
                <input tabindex="1" id="username" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('username')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off" />
                <#if messagesPerField.existsError('username')>
                    <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                </#if>
            </div>

            <div>
                <div class="flex items-center justify-between mb-2">
                    <label for="password" class="block text-sm font-semibold text-slate-600 dark:text-slate-400">${msg("password")}</label>
                    <#if realm.resetPasswordAllowed>
                        <a tabindex="5" href="${url.loginResetCredentialsUrl}" class="text-sm font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">${msg("doForgotPassword")}</a>
                    </#if>
                </div>
                <div class="relative">
                    <input tabindex="2" id="password" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('password')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all pr-12" name="password" type="password" autocomplete="off" />
                    <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onclick="const p = document.getElementById('password'); p.type = p.type === 'password' ? 'text' : 'password';">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
                <#if messagesPerField.existsError('password')>
                    <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                </#if>
            </div>

            <div class="flex items-center justify-between pt-2">
                <#if realm.rememberMe && !usernameHidden??>
                    <div class="flex items-center">
                        <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" class="w-4 h-4 text-rose-500 border-slate-300 rounded focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700" <#if login.rememberMe??>checked</#if>>
                        <label for="rememberMe" class="ml-2 block text-sm text-slate-600 dark:text-slate-400">
                            ${msg("rememberMe")}
                        </label>
                    </div>
                </#if>
            </div>

            <div class="pt-4">
                <button tabindex="4" class="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0" name="login" id="kc-login" type="submit">
                    ${msg("doLogIn")}
                </button>
            </div>
        </form>
        
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 text-center">
                <span class="text-slate-500 dark:text-slate-400">${msg("noAccount")}</span>
                <a tabindex="6" href="${url.registrationUrl}" class="ml-2 font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
                    ${msg("doRegister")}
                </a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
