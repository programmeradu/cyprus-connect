import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, emissions, historicalEmissions, userActions, actions, dashboardMetrics } from '@/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: "emissions" | "renewable" | "waste" | "efficiency" | "quick-win" | "high-impact" | "trending";
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  estimatedSavings: {
    co2e: number;
    cost: number | null;
  };
  effort: "easy" | "medium" | "hard";
  timeframe: string;
  relatedActions: number[];
  dataSource: {
    metric: string;
    currentValue: number;
    targetValue: number;
    trend: string;
  };
}

interface SuggestionSummary {
  totalPotentialReduction: number;
  totalPotentialSavings: number;
  criticalCount: number;
  highPriorityCount: number;
  completionRate: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validation: userId required
    if (!userId || userId.trim() === '') {
      return NextResponse.json({
        error: "User ID is required",
        code: "MISSING_USER_ID"
      }, { status: 400 });
    }

    // Validate user exists
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      }, { status: 404 });
    }

    const userData = userRecord[0];

    // Fetch latest emissions data
    const latestEmissions = await db.select()
      .from(emissions)
      .where(eq(emissions.userId, userId))
      .orderBy(desc(emissions.periodYear), desc(emissions.periodMonth))
      .limit(1);

    // Check if user has any emissions data
    if (latestEmissions.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        summary: {
          totalPotentialReduction: 0,
          totalPotentialSavings: 0,
          criticalCount: 0,
          highPriorityCount: 0,
          completionRate: 0
        },
        message: "Not enough data to generate personalized suggestions. Please track emissions for at least one month.",
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }

    const currentEmissions = latestEmissions[0];

    // Fetch last 3 months of historical emissions
    const historicalData = await db.select()
      .from(historicalEmissions)
      .where(eq(historicalEmissions.userId, userId))
      .orderBy(desc(historicalEmissions.year), desc(historicalEmissions.month))
      .limit(3);

    // Fetch completed actions
    const completedUserActions = await db.select({
      actionId: userActions.actionId,
      completedAt: userActions.completedAt,
      title: actions.title,
      category: actions.category,
      impact: actions.impact,
      points: actions.points,
      difficulty: actions.difficulty
    })
      .from(userActions)
      .innerJoin(actions, eq(userActions.actionId, actions.id))
      .where(eq(userActions.userId, userId));

    // Fetch all available actions
    const allActions = await db.select()
      .from(actions)
      .where(eq(actions.isCustom, false));

    // Fetch dashboard metrics with trends
    const metrics = await db.select()
      .from(dashboardMetrics)
      .where(eq(dashboardMetrics.userId, userId))
      .orderBy(desc(dashboardMetrics.updatedAt))
      .limit(10);

    // Generate suggestions
    const suggestions: Suggestion[] = [];

    // Analyze emission sources
    const emissionSources = [
      { type: 'electricity', value: currentEmissions.electricity, name: 'Electricity' },
      { type: 'gas', value: currentEmissions.gas, name: 'Gas' },
      { type: 'water', value: currentEmissions.water, name: 'Water' },
      { type: 'waste', value: currentEmissions.waste, name: 'Waste' },
      { type: 'transport', value: currentEmissions.transport, name: 'Transport' }
    ].sort((a, b) => b.value - a.value);

    const totalEmissions = currentEmissions.totalCo2e;

    // 1. Emissions Reduction Suggestions (Top 3 sources)
    emissionSources.slice(0, 3).forEach((source, index) => {
      const percentage = (source.value / totalEmissions) * 100;
      
      if (percentage > 25) {
        const potentialReduction = source.value * 0.25;
        const estimatedSavings = source.type === 'electricity' ? potentialReduction * 0.12 * 12 : 
                                 source.type === 'gas' ? potentialReduction * 0.08 * 12 : null;

        suggestions.push({
          id: `emission-${source.type}-${Date.now()}`,
          title: `Optimize ${source.name} Consumption`,
          description: `Your ${source.name.toLowerCase()} usage represents ${percentage.toFixed(1)}% of total emissions at ${source.value.toFixed(2)} kg CO2e. This is significantly higher than industry benchmarks. Implementing energy-efficient practices and upgrading to modern equipment could reduce consumption by 20-30%. Focus on identifying major ${source.name.toLowerCase()} consumers and implementing targeted efficiency measures. Consider conducting an energy audit to identify specific areas for improvement and calculate detailed ROI for equipment upgrades.`,
          category: "emissions",
          priority: percentage > 40 ? "critical" : percentage > 30 ? "high" : "medium",
          impact: estimatedSavings 
            ? `Reduce ${potentialReduction.toFixed(1)} kg CO2e/year and save $${estimatedSavings.toFixed(0)} annually`
            : `Reduce ${potentialReduction.toFixed(1)} kg CO2e/year`,
          estimatedSavings: {
            co2e: potentialReduction,
            cost: estimatedSavings
          },
          effort: percentage > 40 ? "medium" : "easy",
          timeframe: "2-4 months",
          relatedActions: allActions
            .filter(a => a.category === source.type || a.title.toLowerCase().includes(source.type))
            .map(a => a.id)
            .slice(0, 3),
          dataSource: {
            metric: `${source.name} Emissions`,
            currentValue: source.value,
            targetValue: source.value * 0.75,
            trend: percentage > 40 ? "critical" : "needs improvement"
          }
        });
      }
    });

    // 2. Renewable Energy Suggestions
    if (historicalData.length > 0) {
      const avgRenewable = historicalData.reduce((sum, h) => sum + h.renewablePercentage, 0) / historicalData.length;
      
      if (avgRenewable < 30) {
        const potentialReduction = totalEmissions * 0.3;
        
        suggestions.push({
          id: `renewable-${Date.now()}`,
          title: avgRenewable < 20 
            ? "Transition to Renewable Energy Sources" 
            : "Increase Renewable Energy Adoption",
          description: `Your current renewable energy share is ${avgRenewable.toFixed(1)}%, which is below the industry standard of 35-50%. Transitioning to renewable energy is one of the most impactful sustainability initiatives available. Consider switching to a renewable energy tariff from your utility provider, which can often be done immediately with minimal cost impact. For long-term savings, evaluate on-site solar panel installation or power purchase agreements (PPAs). Even a partial transition to renewables can significantly reduce your carbon footprint while demonstrating environmental leadership.`,
          category: "renewable",
          priority: avgRenewable < 15 ? "critical" : avgRenewable < 25 ? "high" : "medium",
          impact: `Reduce ${potentialReduction.toFixed(1)} kg CO2e/year`,
          estimatedSavings: {
            co2e: potentialReduction,
            cost: avgRenewable < 20 ? totalEmissions * 0.05 : null
          },
          effort: "medium",
          timeframe: "3-6 months",
          relatedActions: allActions
            .filter(a => a.title.toLowerCase().includes('renewable') || 
                        a.title.toLowerCase().includes('solar') ||
                        a.category === 'electricity')
            .map(a => a.id)
            .slice(0, 3),
          dataSource: {
            metric: "Renewable Energy Percentage",
            currentValue: avgRenewable,
            targetValue: 40,
            trend: avgRenewable < 20 ? "critical" : "needs improvement"
          }
        });
      }
    }

    // 3. Waste Management Suggestions
    if (historicalData.length > 0) {
      const avgWasteDiversion = historicalData.reduce((sum, h) => sum + h.wasteDiversionRate, 0) / historicalData.length;
      
      if (avgWasteDiversion < 50) {
        const wasteReduction = currentEmissions.waste * 0.4;
        
        suggestions.push({
          id: `waste-${Date.now()}`,
          title: avgWasteDiversion < 30 
            ? "Implement Comprehensive Recycling and Composting Program" 
            : "Enhance Waste Diversion Initiatives",
          description: `Currently, only ${avgWasteDiversion.toFixed(1)}% of your waste is diverted from landfills, which is below the industry target of 60-75%. A structured waste management program can dramatically improve this rate. Start with clear bin labeling and signage, employee training sessions, and regular waste audits to identify opportunities. Consider implementing composting for organic waste, partnering with specialized recyclers for e-waste and plastics, and setting up a materials exchange program. Many organizations achieve 70%+ diversion rates within 12 months with dedicated effort.`,
          category: "waste",
          priority: avgWasteDiversion < 30 ? "high" : "medium",
          impact: `Divert ${(currentEmissions.waste * 0.4).toFixed(1)} kg from landfill, reduce ${wasteReduction.toFixed(1)} kg CO2e`,
          estimatedSavings: {
            co2e: wasteReduction,
            cost: currentEmissions.waste * 0.15
          },
          effort: "easy",
          timeframe: "1-3 months",
          relatedActions: allActions
            .filter(a => a.category === 'waste' || 
                        a.title.toLowerCase().includes('recycl') ||
                        a.title.toLowerCase().includes('compost'))
            .map(a => a.id)
            .slice(0, 3),
          dataSource: {
            metric: "Waste Diversion Rate",
            currentValue: avgWasteDiversion,
            targetValue: 65,
            trend: avgWasteDiversion < 30 ? "critical" : "needs improvement"
          }
        });
      }
    }

    // 4. Resource Efficiency Suggestions
    if (historicalData.length > 0) {
      const avgEfficiency = historicalData.reduce((sum, h) => sum + h.efficiencyScore, 0) / historicalData.length;
      
      if (avgEfficiency < 70) {
        suggestions.push({
          id: `efficiency-${Date.now()}`,
          title: "Improve Overall Resource Efficiency",
          description: `Your resource efficiency score of ${avgEfficiency.toFixed(1)} indicates significant room for optimization across operations. Focus on implementing systematic monitoring and reduction strategies. Install smart meters and sensors to track real-time consumption patterns and identify anomalies. Implement automated systems to reduce energy use during off-hours. Train staff on efficiency best practices and create accountability through departmental tracking. Regular efficiency reviews and small incremental improvements compound over time to deliver substantial results.`,
          category: "efficiency",
          priority: avgEfficiency < 60 ? "high" : "medium",
          impact: `Improve efficiency by ${(70 - avgEfficiency).toFixed(0)} points, reduce ${(totalEmissions * 0.15).toFixed(1)} kg CO2e/year`,
          estimatedSavings: {
            co2e: totalEmissions * 0.15,
            cost: totalEmissions * 0.08
          },
          effort: "medium",
          timeframe: "3-6 months",
          relatedActions: allActions
            .filter(a => a.difficulty === 'medium' && !completedUserActions.find(c => c.actionId === a.id))
            .map(a => a.id)
            .slice(0, 3),
          dataSource: {
            metric: "Efficiency Score",
            currentValue: avgEfficiency,
            targetValue: 75,
            trend: avgEfficiency < 60 ? "critical" : "needs improvement"
          }
        });
      }
    }

    // 5. Quick Wins - Easy uncompleted actions
    const easyActions = allActions.filter(a => 
      a.difficulty === 'easy' && 
      !completedUserActions.find(c => c.actionId === a.id)
    ).slice(0, 2);

    if (easyActions.length > 0) {
      const totalPoints = easyActions.reduce((sum, a) => sum + a.points, 0);
      
      suggestions.push({
        id: `quick-win-${Date.now()}`,
        title: "Complete Quick Impact Actions",
        description: `There are ${easyActions.length} easy-to-implement sustainability actions available that you haven't completed yet. These require minimal effort but deliver meaningful impact. Actions like "${easyActions[0].title}" can be implemented quickly with existing resources. Quick wins build momentum for your sustainability program, engage employees, and demonstrate commitment to environmental goals. These foundational actions often enable more complex initiatives down the line and help establish sustainability practices into organizational culture.`,
        category: "quick-win",
        priority: "medium",
        impact: `Earn ${totalPoints} credits and reduce environmental impact`,
        estimatedSavings: {
          co2e: totalPoints * 0.5,
          cost: null
        },
        effort: "easy",
        timeframe: "1-2 weeks",
        relatedActions: easyActions.map(a => a.id),
        dataSource: {
          metric: "Action Completion Rate",
          currentValue: completedUserActions.length,
          targetValue: completedUserActions.length + easyActions.length,
          trend: "opportunity"
        }
      });
    }

    // 6. High Impact - High-point uncompleted actions
    const highImpactActions = allActions
      .filter(a => 
        a.points >= 30 && 
        !completedUserActions.find(c => c.actionId === a.id)
      )
      .sort((a, b) => b.points - a.points)
      .slice(0, 2);

    if (highImpactActions.length > 0) {
      const totalPoints = highImpactActions.reduce((sum, a) => sum + a.points, 0);
      const estimatedReduction = totalPoints * 2;
      
      suggestions.push({
        id: `high-impact-${Date.now()}`,
        title: "Prioritize High-Impact Sustainability Initiatives",
        description: `High-value actions like "${highImpactActions[0].title}" offer substantial environmental benefits and significant credit rewards (${highImpactActions[0].points} credits). While these initiatives require more planning and resources, they deliver transformational results that fundamentally improve your sustainability profile. These are the types of projects that move organizations from basic compliance to sustainability leadership, creating lasting competitive advantages and demonstrating genuine commitment to environmental stewardship.`,
        category: "high-impact",
        priority: "high",
        impact: `Earn ${totalPoints} credits and reduce ${estimatedReduction.toFixed(1)} kg CO2e/year`,
        estimatedSavings: {
          co2e: estimatedReduction,
          cost: estimatedReduction * 0.1
        },
        effort: highImpactActions[0].difficulty as "easy" | "medium" | "hard",
        timeframe: "3-6 months",
        relatedActions: highImpactActions.map(a => a.id),
        dataSource: {
          metric: "High Impact Actions Available",
          currentValue: 0,
          targetValue: highImpactActions.length,
          trend: "high opportunity"
        }
      });
    }

    // 7. Trending Issues - Based on metrics with negative trends
    const negativeMetrics = metrics.filter(m => m.trendPercentage > 10);
    
    if (negativeMetrics.length > 0) {
      const worstMetric = negativeMetrics.reduce((max, m) => 
        m.trendPercentage > max.trendPercentage ? m : max
      );
      
      suggestions.push({
        id: `trending-${Date.now()}`,
        title: `Address Rising ${worstMetric.metricType} Trend`,
        description: `Your ${worstMetric.metricType} has increased by ${worstMetric.trendPercentage.toFixed(1)}% recently, indicating a concerning trend that requires immediate attention. This upward trajectory, if left unaddressed, could significantly impact your overall sustainability performance and carbon footprint. Investigate the root causes of this increase - whether due to operational changes, seasonal factors, equipment degradation, or behavioral patterns. Implement monitoring systems to catch future increases early and establish corrective action protocols to maintain improvement momentum.`,
        category: "trending",
        priority: worstMetric.trendPercentage > 20 ? "critical" : "high",
        impact: `Stabilize and reverse ${worstMetric.trendPercentage.toFixed(1)}% increase`,
        estimatedSavings: {
          co2e: worstMetric.currentValue * (worstMetric.trendPercentage / 100),
          cost: null
        },
        effort: "medium",
        timeframe: "1-2 months",
        relatedActions: allActions
          .filter(a => a.category === worstMetric.metricType.toLowerCase() || 
                      a.title.toLowerCase().includes(worstMetric.metricType.toLowerCase()))
          .map(a => a.id)
          .slice(0, 3),
        dataSource: {
          metric: worstMetric.metricType,
          currentValue: worstMetric.currentValue,
          targetValue: worstMetric.previousValue,
          trend: `+${worstMetric.trendPercentage.toFixed(1)}%`
        }
      });
    }

    // Industry-specific suggestion if available
    if (userData.companyIndustry && totalEmissions > 0) {
      const industryAverage = totalEmissions * 0.8; // Assume user is 20% above average
      
      if (totalEmissions > industryAverage) {
        suggestions.push({
          id: `industry-${Date.now()}`,
          title: `Align with ${userData.companyIndustry} Industry Standards`,
          description: `Your total emissions of ${totalEmissions.toFixed(1)} kg CO2e are above typical benchmarks for the ${userData.companyIndustry} sector. Industry peers have achieved lower emissions through sector-specific best practices and proven technologies. Research successful case studies within your industry, join industry sustainability working groups, and benchmark against top performers. Industry-specific solutions often deliver better ROI than generic approaches because they address the unique operational characteristics and challenges of your sector.`,
          category: "emissions",
          priority: "medium",
          impact: `Reduce to industry average, saving ${(totalEmissions - industryAverage).toFixed(1)} kg CO2e/year`,
          estimatedSavings: {
            co2e: totalEmissions - industryAverage,
            cost: (totalEmissions - industryAverage) * 0.08
          },
          effort: "medium",
          timeframe: "6-12 months",
          relatedActions: allActions
            .filter(a => a.impact === 'high' && !completedUserActions.find(c => c.actionId === a.id))
            .map(a => a.id)
            .slice(0, 3),
          dataSource: {
            metric: "Industry Comparison",
            currentValue: totalEmissions,
            targetValue: industryAverage,
            trend: "above average"
          }
        });
      }
    }

    // Calculate summary
    const totalPotentialReduction = suggestions.reduce((sum, s) => sum + s.estimatedSavings.co2e, 0);
    const totalPotentialSavings = suggestions.reduce((sum, s) => sum + (s.estimatedSavings.cost || 0), 0);
    const criticalCount = suggestions.filter(s => s.priority === 'critical').length;
    const highPriorityCount = suggestions.filter(s => s.priority === 'high').length;
    
    const totalRecommendedActions = suggestions.reduce((sum, s) => sum + s.relatedActions.length, 0);
    const completedRecommendedActions = suggestions.reduce((sum, s) => {
      return sum + s.relatedActions.filter(actionId => 
        completedUserActions.find(c => c.actionId === actionId)
      ).length;
    }, 0);
    const completionRate = totalRecommendedActions > 0 
      ? (completedRecommendedActions / totalRecommendedActions) * 100 
      : 0;

    const summary: SuggestionSummary = {
      totalPotentialReduction,
      totalPotentialSavings,
      criticalCount,
      highPriorityCount,
      completionRate
    };

    // Sort suggestions by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Limit to 8 suggestions
    const finalSuggestions = suggestions.slice(0, 8);

    return NextResponse.json({
      success: true,
      suggestions: finalSuggestions,
      summary,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET suggestions error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error.message
    }, { status: 500 });
  }
}