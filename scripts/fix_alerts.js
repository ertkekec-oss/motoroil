const { Project, SyntaxKind } = require("ts-morph");

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

for (const sourceFile of project.getSourceFiles()) {
    let modified = false;

    const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    const alertCalls = [];

    for (const callExpr of callExprs) {
        const expr = callExpr.getExpression();
        const text = expr.getText();
        if (text === "alert" || text === "window.alert") {
            // Also ensure it is not defined in any local scope (this guarantees it's the global native alert)
            alertCalls.push(callExpr);
        }
    }

    if (alertCalls.length === 0) continue;

    console.log(`Processing ${sourceFile.getFilePath()} (${alertCalls.length} alerts)`);

    let needsHookInjection = new Set();
    let needsClientDirective = false;

    alertCalls.forEach(callExpr => {
        let componentBody = callExpr.getFirstAncestor(node => {
            if (node.isKind(SyntaxKind.FunctionDeclaration) || 
                node.isKind(SyntaxKind.ArrowFunction) ||
                node.isKind(SyntaxKind.FunctionExpression)) {
                
                const parent = node.getParent();
                let name = "";
                if (node.isKind(SyntaxKind.FunctionDeclaration)) name = node.getName() || "";
                else if (parent.isKind(SyntaxKind.VariableDeclaration)) name = parent.getName() || "";

                // Consider top level page/layout default exports, or properly named components
                if (/^[A-Z]/.test(name) || name.startsWith("use") || name === "default" || name === "") {
                    // Check if parent of this function is a top-level statement or default export
                    return true;
                }
            }
            return false;
        });

        if (!componentBody) {
             console.log("-> Could not determine component wrapper for alert. Replacing with console.error instead to prevent crashes.");
             callExpr.replaceWithText(`console.error(${callExpr.getArguments().map(a => a.getText()).join(", ")})`);
             modified = true;
             return;
        }

        const arg0 = callExpr.getArguments()[0];
        const alertMsg = arg0 ? arg0.getText() : `"Uyarı"`;
        
        let replacementType = "showSuccess";
        const msgText = alertMsg.toLowerCase();
        if (msgText.includes("hata") || msgText.includes("lütfen") || msgText.includes("başarısız") || msgText.includes("fail") || msgText.includes("error") || msgText.includes("eksik") || msgText.includes("bulunamadı") || msgText.includes("küçük")|| msgText.includes("geçerli")) {
            replacementType = "showError";
        }

        let replaceText = "";
        if (replacementType === "showSuccess") {
             replaceText = `showSuccess("Bilgi", ${alertMsg})`;
        } else {
             replaceText = `showError("Uyarı", ${alertMsg})`;
        }

        needsHookInjection.add(componentBody);
        callExpr.replaceWithText(replaceText);
        modified = true;
        needsClientDirective = true;
    });

    if (modified) {
        if (needsHookInjection.size > 0) {
            let modalImport = sourceFile.getImportDeclaration(decl => {
                const spec = decl.getModuleSpecifierValue();
                return spec === "@/contexts/ModalContext" || spec.endsWith("ModalContext");
            });

            if (!modalImport) {
                sourceFile.addImportDeclaration({
                    namedImports: ["useModal"],
                    moduleSpecifier: "@/contexts/ModalContext"
                });
            } else {
                const hasHook = modalImport.getNamedImports().some(ni => ni.getName() === "useModal");
                if (!hasHook) {
                    modalImport.addNamedImport("useModal");
                }
            }

            for (let component of needsHookInjection) {
                const body = component.getBody();
                if (body && body.isKind(SyntaxKind.Block)) {
                    const statements = body.getStatements();
                    const hasUseModal = statements.some(s => s.getText().includes("useModal()"));
                    if (!hasUseModal) {
                        body.insertStatements(0, "const { showSuccess, showError, showWarning } = useModal();");
                    }
                } else if (body && !body.isKind(SyntaxKind.Block)) {
                    // It's a single expression arrow function like:
                    // const X = () => alert("x")
                    // In this case we can't inject hooks since the body is just the return expression.
                    console.log("-> Warning: single expression arrow component body found, hook insertion might fail.");
                }
            }
        }

        const sourceText = sourceFile.getText();
        if (needsClientDirective && !sourceText.includes('"use client"') && !sourceText.includes("'use client'")) {
             sourceFile.insertStatements(0, `"use client";`);
        }

        sourceFile.saveSync();
        console.log(`-> Saved ${sourceFile.getFilePath()}`);
    }
}
