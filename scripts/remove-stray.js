const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const lines = data.split('\n');

const toRemove = [1238, 1459, 1537]; // zero-indexed will be -1
// Let's accurately find the stray `)}` instead of hardcoding by line number, because line numbers changed.
// They are exactly `                            )}` right before `                        </div>` and `                    ) : activeTab ===`

data = data.replace(/<\/div>\s*\n\s*\)\}\s*\n\s*<\/div>\s*\n\s*\) : activeTab === 'reconciliation'/g, 
    `</div>\n                        </div>\n                    ) : activeTab === 'reconciliation'`);

data = data.replace(/<\/div>\s*\n\s*\)\}\s*\n\s*<\/div>\s*\n\s*\{?\/\* PAYMENT PLANS COLUMN \*\/?/g, 
    `</div>\n                                </div>\n\n                                {/* PAYMENT PLANS COLUMN */`);

data = data.replace(/<\/div>\s*\n\s*\)\}\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/main>/g, 
    `</div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </main>`);

// But wait, my manual replacements above might be too strict. 
// A safer regex for `)}` right before a `</div>` closing a tab section:
// Let's replace `/(\s*)</div>\s*\n\s*\)\}\s*\n\s*<\/div>/g` with `$1</div>\n$1</div>` maybe?
// Let's just do it directly.
fs.writeFileSync('scripts/remove-stray-braces.js', `
const fs = require('fs');
let content = fs.readFileSync('${file}', 'utf8');

const regex1 = /<\\/table>\\s*\\n\\s*<\\/div>\\s*\\n\\s*\\)\\}\\s*\\n\\s*<\\/div>\\s*\\n\\s*\\) : activeTab === 'reconciliation'/g;
content = content.replace(regex1, "</table>\\n                                </div>\\n                        </div>\\n                    ) : activeTab === 'reconciliation'");

const regex2 = /<\\/div>\\s*\\n\\s*\\)\\}\\s*\\n\\s*<\\/div>\\s*\\n\\s*\\{\\/\\* PAYMENT PLANS/g;
content = content.replace(regex2, "</div>\\n                                </div>\\n\\n                                {/* PAYMENT PLANS");

const regex3 = /<\\/div>\\s*\\n\\s*\\)\\}\\s*\\n\\s*<\\/div>\\s*\\n\\s*<\\/div>\\s*\\n\\s*<\\/div>\\s*\\n\\s*<\\/div>\\s*\\n\\s*<\\/div>\\s*\\n\\s*<\\/main>/g;
content = content.replace(regex3, "</div>\\n                        </div>\\n                    </div>\\n                </div>\\n            </div>\\n        </div>\\n    </main>");

fs.writeFileSync('${file}', content);
console.log("Stray braces removed.");
`);
