class MemoryDashboard {
    constructor() {
        this.baseUrl = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadMemory();
        this.loadStats();
    }

    bindEvents() {
        document.getElementById('refreshMemory').addEventListener('click', () => this.loadMemory());
        document.getElementById('saveMemory').addEventListener('click', () => this.saveMemory());
        document.getElementById('loadHistory').addEventListener('click', () => this.loadHistory());
        document.getElementById('appendButton').addEventListener('click', () => this.appendMemory());
        document.getElementById('rollbackButton').addEventListener('click', () => this.rollbackMemory());
        
        document.getElementById('memoryContent').addEventListener('input', () => {
            document.getElementById('memoryContent').classList.add('modified');
        });
    }

    async loadMemory() {
        try {
            this.showNotification('Loading memory...', 'info');
            const response = await fetch(`${this.baseUrl}/api/memory`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('memoryContent').value = data.content || 'No memory content available.';
                document.getElementById('memoryContent').classList.remove('modified');
                this.updateStatus('Connected');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Error loading memory: ${error.message}`, 'error');
            this.updateStatus('Disconnected');
        }
    }

    async saveMemory() {
        const content = document.getElementById('memoryContent').value;
        
        try {
            this.showNotification('Saving memory...', 'info');
            
            // For now, we append the new content
            const response = await fetch(`${this.baseUrl}/api/memory/append`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content,
                    description: 'Updated via Memory Dashboard'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('memoryContent').classList.remove('modified');
                this.showNotification('Memory saved successfully!', 'success');
                this.loadStats();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Error saving memory: ${error.message}`, 'error');
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/memory/stats`);
            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                document.getElementById('totalSize').textContent = this.formatBytes(stats.totalMemorySize || 0);
                document.getElementById('memoryFiles').textContent = stats.memoryFiles?.length || 0;
                document.getElementById('gitCommits').textContent = stats.totalCommits || 0;
                document.getElementById('contextUsage').textContent = stats.contextUsage || '--';
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadHistory() {
        const limit = document.getElementById('historyLimit').value;
        
        try {
            this.showNotification('Loading history...', 'info');
            const response = await fetch(`${this.baseUrl}/api/memory/history?limit=${limit}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderHistory(data.history);
                this.updateRollbackOptions(data.history);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Error loading history: ${error.message}`, 'error');
        }
    }

    renderHistory(history) {
        const tbody = document.querySelector('#historyTable tbody');
        tbody.innerHTML = '';
        
        history.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><code>${entry.hash.substring(0, 7)}</code></td>
                <td>${this.escapeHtml(entry.message)}</td>
                <td>${new Date(entry.date).toLocaleString()}</td>
                <td class="history-actions">
                    <button class="btn btn-secondary" onclick="dashboard.rollbackTo('${entry.hash}')">Rollback</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateRollbackOptions(history) {
        const select = document.getElementById('rollbackCommit');
        select.innerHTML = '<option value="">Select commit to rollback...</option>';
        
        history.forEach(entry => {
            const option = document.createElement('option');
            option.value = entry.hash;
            option.textContent = `${entry.hash.substring(0, 7)} - ${entry.message.substring(0, 50)}...`;
            select.appendChild(option);
        });
    }

    async appendMemory() {
        const content = document.getElementById('appendContent').value;
        const description = document.getElementById('appendDescription').value;
        
        if (!content.trim()) {
            this.showNotification('Please enter content to append', 'error');
            return;
        }
        
        try {
            this.showNotification('Appending memory...', 'info');
            const response = await fetch(`${this.baseUrl}/api/memory/append`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, description })
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('appendContent').value = '';
                document.getElementById('appendDescription').value = '';
                this.showNotification('Memory appended successfully!', 'success');
                this.loadMemory();
                this.loadStats();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Error appending memory: ${error.message}`, 'error');
        }
    }

    async rollbackMemory() {
        const commitHash = document.getElementById('rollbackCommit').value;
        const reason = document.getElementById('rollbackReason').value;
        
        if (!commitHash) {
            this.showNotification('Please select a commit to rollback', 'error');
            return;
        }
        
        if (!reason.trim()) {
            this.showNotification('Please provide a reason for rollback', 'error');
            return;
        }
        
        try {
            this.showNotification('Rolling back memory...', 'info');
            const response = await fetch(`${this.baseUrl}/api/memory/rollback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commitHash, reason })
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('rollbackCommit').value = '';
                document.getElementById('rollbackReason').value = '';
                this.showNotification('Memory rolled back successfully!', 'success');
                this.loadMemory();
                this.loadStats();
                this.loadHistory();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Error rolling back memory: ${error.message}`, 'error');
        }
    }

    async rollbackTo(hash) {
        const reason = prompt('Enter reason for rollback:');
        if (!reason) return;
        
        try {
            this.showNotification('Rolling back memory...', 'info');
            const response = await fetch(`${this.baseUrl}/api/memory/rollback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commitHash: hash, reason })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Memory rolled back successfully!', 'success');
                this.loadMemory();
                this.loadStats();
                this.loadHistory();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showNotification(`Error rolling back memory: ${error.message}`, 'error');
        }
    }

    showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    updateStatus(status) {
        document.getElementById('status').textContent = status;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard
const dashboard = new MemoryDashboard();