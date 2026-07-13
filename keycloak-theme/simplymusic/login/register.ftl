<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm'); section>
    <#if section = "header">
        ${msg("registerTitle")}
    <#elseif section = "form">
        <h1 class="text-3xl font-extrabold text-slate-800 dark:text-white text-center mb-8 tracking-tight">${msg("registerTitle")}</h1>

        <form id="kc-register-form" class="space-y-4" action="${url.registrationAction}" method="post">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label for="firstName" class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">${msg("firstName")}</label>
                    <input type="text" id="firstName" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('firstName')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all" name="firstName" value="${(register.formData.firstName!'')}" autocomplete="given-name" />
                    <#if messagesPerField.existsError('firstName')>
                        <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</span>
                    </#if>
                </div>
                <div>
                    <label for="lastName" class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">${msg("lastName")}</label>
                    <input type="text" id="lastName" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('lastName')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all" name="lastName" value="${(register.formData.lastName!'')}" autocomplete="family-name" />
                    <#if messagesPerField.existsError('lastName')>
                        <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</span>
                    </#if>
                </div>
            </div>

            <div>
                <label for="email" class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">${msg("email")}</label>
                <input type="text" id="email" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('email')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all" name="email" value="${(register.formData.email!'')}" autocomplete="email" />
                <#if messagesPerField.existsError('email')>
                    <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('email'))?no_esc}</span>
                </#if>
            </div>

            <#if !realm.registrationEmailAsUsername>
                <div>
                    <label for="username" class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">${msg("username")}</label>
                    <input type="text" id="username" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('username')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all" name="username" value="${(register.formData.username!'')}" autocomplete="username" />
                    <#if messagesPerField.existsError('username')>
                        <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                    </#if>
                </div>
            </#if>

            <#if passwordRequired??>
                <div>
                    <label for="password" class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">${msg("password")}</label>
                    <div class="relative">
                        <input type="password" id="password" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('password')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all pr-12" name="password" autocomplete="new-password"/>
                        <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onclick="const p = document.getElementById('password'); p.type = p.type === 'password' ? 'text' : 'password';">
                            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                    </div>
                    <#if messagesPerField.existsError('password')>
                        <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                    </#if>
                </div>

                <div>
                    <label for="password-confirm" class="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">${msg("passwordConfirm")}</label>
                    <div class="relative">
                        <input type="password" id="password-confirm" class="w-full bg-slate-100 dark:bg-slate-900/50 border ${messagesPerField.existsError('password-confirm')?then('border-rose-500', 'border-slate-200 dark:border-slate-700')} text-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all pr-12" name="password-confirm" />
                        <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onclick="const p = document.getElementById('password-confirm'); p.type = p.type === 'password' ? 'text' : 'password';">
                            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                    </div>
                    <#if messagesPerField.existsError('password-confirm')>
                        <span class="text-sm text-rose-500 mt-1 block font-medium">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
                    </#if>
                </div>
            </#if>

            <div class="pt-6">
                <button class="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0" type="submit">
                    ${msg("doRegister")}
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
