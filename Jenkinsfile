pipeline {
    agent { label 'java-agent-template' }
    options { skipDefaultCheckout(true) }

    stages {
        stage('Checkout') {
            steps {
                echo 'Downloading project from GitHub'
                checkout scm
            }
        }

        stage('Build, test and package') {
            steps {
                sh 'mvn -B clean verify'
            }
        }
    }

    post {
        success {
            archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
        }
    }
}