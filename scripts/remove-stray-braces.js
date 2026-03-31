
const fs = require('fs');
let content = fs.readFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', 'utf8');

const regex1 = /<\/table>\s*\n\s*<\/div>\s*\n\s*\)\}\s*\n\s*<\/div>\s*\n\s*\) : activeTab === 'reconciliation'/g;
content = content.replace(regex1, "</table>\n                                </div>\n                        </div>\n                    ) : activeTab === 'reconciliation'");

const regex2 = /<\/div>\s*\n\s*\)\}\s*\n\s*<\/div>\s*\n\s*\{\/\* PAYMENT PLANS/g;
content = content.replace(regex2, "</div>\n                                </div>\n\n                                {/* PAYMENT PLANS");

const regex3 = /<\/div>\s*\n\s*\)\}\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/main>/g;
content = content.replace(regex3, "</div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </main>");

fs.writeFileSync('src/app/(app)/customers/[id]/CustomerDetailClient.tsx', content);
console.log("Stray braces removed.");
